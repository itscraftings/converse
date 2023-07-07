import { config } from "dotenv"
import express from "express"
import { createServer } from "http"
import cors from "cors"
import { WebSocketServer } from "ws"
import typeDefs from "./graphql/typeDefs"
import resolvers from "./graphql/resolvers"
import { makeExecutableSchema } from "@graphql-tools/schema"
import { getSession } from "next-auth/react"
import { GraphQLContext, Session, SubscriptionContext } from "./util/types"
import { PrismaClient } from "@prisma/client"
import { PubSub } from "graphql-subscriptions"
import { ApolloServer } from "@apollo/server"
import { expressMiddleware } from "@apollo/server/express4"
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer"
import { json } from "body-parser"
import { useServer } from "graphql-ws/lib/use/ws"

interface MyContext {
	token?: string
}

async function main() {
	// dotenv
	config()

	const app = express()
	const httpServer = createServer(app)
	const wsServer = new WebSocketServer({
		server: httpServer,
		path: "/graphql/subscriptions"
	})
	const prisma = new PrismaClient()
	const pubsub = new PubSub()
	const schema = makeExecutableSchema({
		typeDefs,
		resolvers
	})
	const server = new ApolloServer<MyContext>({
		schema,
		plugins: [
			ApolloServerPluginDrainHttpServer({ httpServer }),
			{
				async serverWillStart() {
					return {
						async drainServer() {
							await serverCleanup.dispose()
						}
					}
				}
			}
		]
	})
	const serverCleanup = useServer(
		{
			schema,
			async context(ctx: SubscriptionContext): Promise<GraphQLContext> {
				if (ctx.connectionParams?.session) {
					const { session } = ctx.connectionParams

					return { session, prisma, pubsub }
				}

				return { session: null, prisma, pubsub }
			}
		},
		wsServer
	)

	await server.start()
	app.use(
		"/graphql",

		cors<cors.CorsRequest>({
			origin: process.env.CLIENT_ORIGIN,
			credentials: true
		}),
		json(),
		expressMiddleware(server, {
			async context({ req }): Promise<GraphQLContext> {
				const session = (await getSession({ req })) as unknown as Session

				return { session, prisma, pubsub }
			}
		})
	)
	await new Promise<void>(resolve => httpServer.listen({ port: 4000 }, resolve))

	console.log(`🚀 The server ready at http://localhost:4000/graphql`)
}

main().catch(error => console.log(error))
