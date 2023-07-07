import { Flex } from "@chakra-ui/react"
import { Session } from "next-auth"
import { useRouter } from "next/router"
import MessagesHeader from "./messages/header"
import MessageInput from "./messages/input"
import Messages from "./messages"

interface FeedWrapperProps {
	session: Session
}

export default function FeedWrapper({ session }: FeedWrapperProps) {
	// router
	const router = useRouter()
	const { conversationId } = router.query

	// conversationId
	const {
		user: { id: userId }
	} = session

	return (
		<Flex display={{ base: conversationId ? "flex" : "none" }} width="100%" direction="column">
			{conversationId && typeof conversationId === "string" ? (
				<>
					<Flex direction="column" justify="space-between" overflow="hidden" flexGrow={1}>
						<MessagesHeader userId={userId} conversationId={conversationId} />
						<Messages userId={userId} conversationId={conversationId} />
					</Flex>
					<MessageInput session={session} conversationId={conversationId} />
				</>
			) : (
				<div>
					<p>No conversation selected</p>
				</div>
			)}
		</Flex>
	)
}
