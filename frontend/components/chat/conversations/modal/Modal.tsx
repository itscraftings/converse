import {
	Button,
	Input,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalHeader,
	ModalOverlay,
	Stack
} from "@chakra-ui/react"
import { FormEvent, useState } from "react"
import { useLazyQuery, useMutation } from "@apollo/client"
import {
	CreateConversationData,
	CreateConversationInput,
	SearchUsersData,
	SearchUsersInput,
	SearchedUser
} from "@/util/types"
import UsersSearchList from "./UserSearchList"
import Participants from "./Participants"
import UserOperations from "@/graphql/operations/user"
import ConversationOperations from "@/graphql/operations/conversation"
import { Session } from "next-auth"
import { useRouter } from "next/router"

interface ConversationModalProps {
	session: Session
	isOpen: boolean
	onClose(): void
}

export default function ConversationModal({ session, isOpen, onClose }: ConversationModalProps) {
	const {
		user: { id: userId }
	} = session
	const router = useRouter()
	const [username, setUsername] = useState<string>("")
	const [participants, setParticipants] = useState<SearchedUser[]>([])
	const [SearchUsers, { data, loading }] = useLazyQuery<SearchUsersData, SearchUsersInput>(
		UserOperations.Queries.searchUsers
	)
	const [createConversation, { loading: createConversationLoading }] = useMutation<
		CreateConversationData,
		CreateConversationInput
	>(ConversationOperations.Mutations.createConversation)

	async function onSubmit(event: FormEvent) {
		event.preventDefault()

		SearchUsers({ variables: { username } })
	}

	function addParticipant(user: SearchedUser) {
		setParticipants(prev => [...prev, user])
		setUsername("")
	}

	function removeParticipant(userId: string) {
		setParticipants(prev => prev.filter(p => p.id !== userId))
	}

	async function onCreateConversation() {
		const participantIds = [userId, ...participants.map(p => p.id)]

		try {
			const { data } = await createConversation({
				variables: {
					participantIds
				}
			})

			if (!data?.createConversation) {
				throw new Error("Failed to create a conversation")
			}

			const {
				createConversation: { conversationId }
			} = data

			router.push({ query: { conversationId } })

			/*
				Clear state and close the modal
				on a successful creation
			*/
			setParticipants([])
			setUsername("")
			onClose()

			console.log("HERE IS DATA", data)
		} catch (error: any) {
			console.log("onCreateConversation error", error)
		}
	}

	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<ModalOverlay />

			<ModalContent>
				<ModalHeader>Create a conversation</ModalHeader>

				<ModalCloseButton />

				<ModalBody>
					<form onSubmit={onSubmit}>
						<Stack spacing={4}>
							<Input
								placeholder="Enter a username"
								value={username}
								onChange={event => setUsername(event.target.value)}
							/>
							<Button type="submit" disabled={!username} isLoading={loading}>
								Search
							</Button>
						</Stack>
					</form>

					{data?.searchUsers && <UsersSearchList users={data?.searchUsers} addParticipant={addParticipant} />}

					{participants.length !== 0 && (
						<>
							<Participants participants={participants} removeParticipant={removeParticipant} />

							<Button
								bg="brand.100"
								width="100%"
								mt={6}
								_hover={{ _bg: "brand.100" }}
								isLoading={createConversationLoading}
								onClick={onCreateConversation}
							>
								Create a conversation
							</Button>
						</>
					)}
				</ModalBody>
			</ModalContent>
		</Modal>
	)
}
