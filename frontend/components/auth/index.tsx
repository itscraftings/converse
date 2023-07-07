import { useState } from "react"
import { Center, Stack, Text, Button, Input } from "@chakra-ui/react"
import { signIn } from "next-auth/react"
import { Session } from "next-auth"
import Image from "next/image"
import { useMutation } from "@apollo/client"
import UserOperations from "@/graphql/operations/user"
import { CreateUsernameData, CreateUsernameVariables } from "@/util/types"

interface AuthProps {
	session: Session | null
	reloadSession(): void
}

export default function Auth({ session, reloadSession }: AuthProps) {
	const [username, setUsername] = useState<string>("")
	const [email, setEmail] = useState<string>("")
	const [createUsername, { loading, error }] = useMutation<CreateUsernameData, CreateUsernameVariables>(
		UserOperations.Mutations.createUsername
	)

	async function onSubmit() {
		if (!username) return

		try {
			const { data } = await createUsername({ variables: { username } })

			if (!data?.createUsername) {
				throw new Error(error?.message)
			}

			if (data.createUsername.error) {
				const {
					createUsername: { error }
				} = data

				throw new Error(error)
			}
		} catch (error) {
			console.error("onSubmit error:", error)
		}
	}

	return (
		<Center height="100vh" border="1px solid red">
			<Stack spacing={8} align="center">
				{session ? (
					<>
						<Text fontSize="3xl">Create a username</Text>
						<Input
							placeholder="Enter a username"
							value={username}
							onChange={event => setUsername(event.target.value)}
						/>
						<Button width="100%" onClick={onSubmit} isLoading={loading}>
							Save
						</Button>
					</>
				) : (
					<>
						<Text fontSize="3xl">MessengerQL</Text>
						<Button
							onClick={() => signIn("google")}
							leftIcon={<Image height={20} width={20} src="/google.svg" alt="Ico" />}
						>
							Continue with Google
						</Button>

						{/* <hr />
						<p>Or</p>

						<input
							type="text"
							placeholder="Email"
							value={email}
							onChange={e => setEmail(e.target.value)}
						/>

						<Button onClick={() => signIn("email", { email, redirect: false })}>Sign in with Email</Button> */}
					</>
				)}
			</Stack>
		</Center>
	)
}
