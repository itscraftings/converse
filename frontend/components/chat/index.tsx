import { /*Button,*/ Flex } from "@chakra-ui/react"
// import { signOut } from "next-auth/react"
import ConversationsWrapper from "./conversations/conversationsWrapper"
import FeedWrapper from "./feed/feedWrapper"
import { Session } from "next-auth"

interface ChatProps {
	session: Session
}

export default function Chat({ session }: ChatProps) {
	return (
		<Flex height="100vh">
			<ConversationsWrapper session={session} />
			<FeedWrapper session={session} />

			{/* <button type="button" onClick={() => signOut()}>
				Logout
			</button> */}
		</Flex>
	)
}
