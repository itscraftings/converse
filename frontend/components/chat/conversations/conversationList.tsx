import { Box, Button, Text } from "@chakra-ui/react"
import { Session } from "next-auth"
import ConversationModal from "./modal/Modal"
import { useState } from "react"
import { ConversationPopulated } from "@/../backend/util/types"
import { useRouter } from "next/router"
import ConversationItem from "./conversationItem"
import { useMutation } from "@apollo/client"
import ConverastionOperations from "@/graphql/operations/conversation"
import { toast } from "react-hot-toast"
import { signOut } from "next-auth/react"

interface ConversationListProps {
	session: Session
	conversations: ConversationPopulated[]
	onViewConversation(conversationId: string, hasSeenLatestMessage: boolean): void
}

export default function ConversationList({
	session,
	conversations,
	onViewConversation
}: ConversationListProps) {
	const router = useRouter()
	const { id: userId } = session.user
	const [isOpen, setIsOpen] = useState<boolean>(false)

	const [deleteConversation] = useMutation<{ onDeleteConversation: boolean; conversationId: string }>(
		ConverastionOperations.Mutations.deleteConversation
	)

	async function onDeleteConversation(conversationId: string) {
		try {
			toast.promise(
				deleteConversation({
					variables: {
						conversationId
					},
					update() {
						router.replace("")
					}
				}),
				{
					loading: "Deleting the conversation",
					success: "The Conversation Deleted",
					error: "Failed to delete the conversation"
				}
			)
		} catch (error: any) {
			console.log("onDeleteConversation error", error)
		}
	}

	// Sorting conversations
	const sortedConversations = [...conversations.sort((a, b) => b.updatedAt.valueOf() - a.updatedAt.valueOf())]

	function onOpen(): void {
		setIsOpen(true)
	}

	function onClose(): void {
		setIsOpen(false)
	}

	return (
		<Box width={{ base: "100%", md: "400px" }} position="relative" height="100%">
			<Box py={2} px={4} mb={4} bg="blackAlpha.300" borderRadius={4} cursor="pointer" onClick={onOpen}>
				<Text textAlign="center" color="whiteAlpha.800" fontWeight={500}>
					Find or start a conversation
				</Text>
			</Box>

			<ConversationModal session={session} isOpen={isOpen} onClose={onClose} />

			{sortedConversations.map(conversation => {
				const participant = conversation.participants.find((p: any) => p.user.id === userId)

				return (
					<ConversationItem
						key={conversation.id}
						userId={userId}
						conversation={conversation}
						onClick={() => onViewConversation(conversation.id, participant?.hasSeenLatestMessage)}
						hasSeenLatestMessage={participant?.hasSeenLatestMessage}
						isSelected={conversation.id === router.query.conversationId}
						onDeleteConversation={onDeleteConversation}
					/>
				)
			})}

			<Box position="absolute" bottom={0} left={0} width="100%" px={8}>
				<Button width="100%" onClick={() => signOut()}>
					Logout
				</Button>
			</Box>
		</Box>
	)
}
