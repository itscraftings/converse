import { ApolloProvider } from "@apollo/client/react"
import { client } from "@/graphql/apollo-client"
import { SessionProvider } from "next-auth/react"
import { ChakraProvider } from "@chakra-ui/react"
import { theme } from "@/chakra/theme"
import type { AppProps } from "next/app"

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
	return (
		<ApolloProvider client={client}>
			<SessionProvider session={pageProps.session}>
				<ChakraProvider theme={theme}>
					<Component {...pageProps} />
				</ChakraProvider>
			</SessionProvider>
		</ApolloProvider>
	)
}
