import { Session } from "next-auth"
import { FormEvent, useState } from "react"
import { Box, Input } from "@chakra-ui/react"
import toast from "react-hot-toast"
import MessageOperations from "@/graphql/operations/message"
import { sendMessageArguments } from "../../../../../backend/util/types"
import { useMutation } from "@apollo/client"
import { ObjectId } from "bson"
import { MessagesData } from "@/util/types"

interface MessageInputProps {
	session: Session
	conversationId: string
}

export default function MessageInput({ session, conversationId }: MessageInputProps) {
	const [messageBody, setMessageBody] = useState<string>("")
	const [sendMessage] = useMutation<{ sendMessage: boolean }, sendMessageArguments>(
		MessageOperations.Mutation.sendMessage
	)

	async function onSendMessage(event: FormEvent) {
		event.preventDefault()

		try {
			// call sendMessage mutation
			const { id: senderId } = session.user
			const messageId = new ObjectId().toString()
			const newMessage: sendMessageArguments = {
				id: messageId,
				senderId,
				conversationId,
				body: messageBody
			}

			setMessageBody("") // Clear inout state

			const { data, errors } = await sendMessage({
				variables: {
					...newMessage
				},
				optimisticResponse: {
					sendMessage: true
				},
				update(cache) {
					const existing = cache.readQuery<MessagesData>({
						query: MessageOperations.Query.messages,
						variables: { conversationId }
					}) as MessagesData

					cache.writeQuery<MessagesData, { conversationId: string }>({
						query: MessageOperations.Query.messages,
						variables: { conversationId },
						data: {
							...existing,
							messages: [
								{
									...newMessage,
									sender: {
										id: session.user.id,
										username: session.user.username
									},
									createdAt: new Date(Date.now()),
									updatedAt: new Date(Date.now())
								},
								...existing.messages
							]
						}
					})
				}
			})

			if (!data?.sendMessage || errors) {
				throw new Error("failed to send a message")
			}
		} catch (error: any) {
			console.log("onSendMessage error", error)
			toast.error(error?.message)
		}
	}

	return (
		<Box px={4} py={6} width="100%">
			<form onSubmit={onSendMessage}>
				<Input
					value={messageBody}
					onChange={event => setMessageBody(event.target.value)}
					placeholder="Message"
					size="md"
					resize="none"
					_focus={{
						boxShadow: "none",
						border: "1px solid",
						borderColor: "whiteAlpha.300"
					}}
				/>
			</form>
		</Box>
	)
}
