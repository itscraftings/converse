import { NextPageContext } from "next"
import { getSession, useSession } from "next-auth/react"
import { Box } from "@chakra-ui/react"
import Chat from "@/components/chat"
import Auth from "@/components/auth"

export default function Home() {
	const { data: session } = useSession()

	function reloadSession() {
		const event = new Event("visibilitychange")
		document.dispatchEvent(event)
	}

	return (
		<Box>
			{session?.user?.username ? (
				<Chat session={session} />
			) : (
				<Auth session={session} reloadSession={reloadSession} />
			)}
		</Box>
	)
}

export async function getServerSideProps(context: NextPageContext) {
	const session = await getSession(context)

	return {
		props: {
			session
		}
	}
}
