import { Session } from "next-auth"
import ConversationList from "./conversationList"
import ConversationOperations from "@/graphql/operations/conversation"
import { gql, useMutation, useQuery, useSubscription } from "@apollo/client"
import { ConversationDeletedData, ConversationUpdatedData, ConversationsData } from "@/util/types"
import { ConversationPopulated, participantPopulated } from "@/../backend/util/types"
import { useEffect } from "react"
import { useRouter } from "next/router"
import SkeletonLoader from "@/components/common/skeletonLoader"
import { toast } from "react-hot-toast"
import { Box } from "@chakra-ui/react"

interface ConversationsWrapperProps {
	session: Session
}

export default function ConversationsWrapper({ session }: ConversationsWrapperProps) {
	const { query, push } = useRouter()
	const { conversationId } = query
	const { id: userId } = session.user
	const conversations = useQuery<ConversationsData>(ConversationOperations.Queries.conversations, {
		onError({ message }) {
			toast.error(message)
		}
	})

	/**
	 * Mutations
	 */
	const [markConversationAsRead] = useMutation<
		{ markConversationAsRead: true },
		{ userId: string; conversationId: string }
	>(ConversationOperations.Mutations.markConversationAsRead)

	useSubscription<ConversationUpdatedData>(ConversationOperations.Subscriptions.conversationUpdated, {
		onData({ client, data: { data: subscriptionData } }) {
			console.log("ON DATA FIRING:", subscriptionData)

			if (!subscriptionData) {
				return
			}

			// Mark as read when a user get a message from an opened conversation
			const { conversation: updatedConversation } = subscriptionData.conversationUpdated
			const currentlyViewingConversation = updatedConversation.id === conversationId
			if (currentlyViewingConversation) {
				onViewConversation(conversationId as string, false)
			}
		}
	})

	useSubscription<ConversationDeletedData>(ConversationOperations.Subscriptions.conversationDeleted, {
		onData({ client, data }) {
			console.log("HERE IS SUBSCRIPTION DATA", data)
		}
	})

	async function onViewConversation(conversationId: string, hasSeenLatestMessage: boolean) {
		/**
		 * 1. Push the conversationId to the router query params
		 */
		push({ query: { conversationId } })

		/**
		 * 2. Mark the conversatopm as read
		 */
		if (hasSeenLatestMessage) {
			return
		}

		// markConversationAsRead mutation
		try {
			await markConversationAsRead({
				variables: {
					userId,
					conversationId
				},
				optimisticResponse: {
					markConversationAsRead: true
				},
				update(cache) {
					/**
					 * Get conversation participants from cache
					 */
					const participantsFragment = cache.readFragment<{ participants: participantPopulated[] }>({
						id: `Conversation: ${conversationId}`,
						fragment: gql`
							fragment Participants on Conversation {
								participants {
									user {
										id
										username
									}
									hasSeenLatestMessage
								}
							}
						`
					})

					if (!participantsFragment) {
						return
					}

					const participants = [...participantsFragment.participants]
					const userParticipantIdx = participants.findIndex(p => p.user.id === userId)

					if (userParticipantIdx === -1) {
						return
					}

					const userParticipant = participants[userParticipantIdx]

					/**
					 * Update participant to show latest message as read
					 */
					participants[userParticipantIdx] = {
						...userParticipant,
						hasSeenLatestMessage: true
					}

					/**
					 * Update cache
					 */
					cache.writeFragment({
						id: `Conversation: ${conversationId}`,
						fragment: gql`
							fragment UpdatedParticipant on Conversation {
								participants
							}
						`,
						data: {
							participants
						}
					})
				}
			})
		} catch (error) {
			console.log("onViewConversation error", error)
		}
	}

	function subscribeToNewConversations() {
		conversations.subscribeToMore({
			document: ConversationOperations.Subscriptions.conversationCreated,

			updateQuery(
				prev,
				{ subscriptionData }: { subscriptionData: { data: { conversationCreated: ConversationPopulated } } }
			) {
				if (!subscriptionData.data) {
					return prev
				}

				const newConversation = subscriptionData.data.conversationCreated

				return Object.assign({}, prev, {
					conversations: [newConversation, ...prev.conversations]
				})
			}
		})
	}

	/**
	 * Execute subscription on mount
	 */
	useEffect(() => {
		subscribeToNewConversations()
	}, [])

	return (
		<div>
			<Box
				display={{ base: query.conversationId ? "none" : "flex", md: "flex" }}
				width={{ base: "100%", md: "430px" }}
				flexDirection="column"
				gap={3}
				height="full"
				bg="whiteAlpha.50"
				py={6}
				px={3}
			>
				{conversations.loading ? (
					<SkeletonLoader count={7} height="80px" />
				) : (
					<ConversationList
						session={session}
						conversations={conversations.data?.conversations || []}
						onViewConversation={onViewConversation}
					/>
				)}
			</Box>
		</div>
	)
}
