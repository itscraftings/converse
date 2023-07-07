import { GraphQLError } from "graphql"
import { CreateUsernameResponse, GraphQLContext } from "../../util/types"
import { User } from "@prisma/client"

const resolvers = {
	Query: {
		async searchUsers(_: any, args: { username: string }, context: GraphQLContext): Promise<Array<User>> {
			const { username: searchedUsername } = args
			const { session, prisma } = context

			if (!session) {
				throw new GraphQLError("Not authorized")
			}

			const { username: myUsername } = session.user

			try {
				const users = await prisma.user.findMany({
					where: {
						username: {
							contains: searchedUsername,
							not: myUsername,
							mode: "insensitive"
						}
					}
				})

				return users
			} catch (error: any) {
				console.log("searchUsers error", error)
				throw new GraphQLError(error?.message)
			}
		}
	},
	Mutation: {
		async createUsername(
			_: any,
			args: { username: string },
			context: GraphQLContext
		): Promise<CreateUsernameResponse> {
			const { username } = args
			const { session, prisma } = context

			if (!session) {
				return {
					error: "Not authorized"
				}
			}

			const { id: userId } = session?.user

			try {
				/*
					Check, that a username is not taken
				*/
				const existingUser = await prisma.user.findUnique({
					where: {
						username
					}
				})

				if (existingUser) {
					return {
						error: "Username is already taken, try another"
					}
				}

				/*
					Update a user
				*/
				await prisma.user.update({
					where: {
						id: userId
					},
					data: {
						username
					}
				})

				return { success: true }
			} catch (error: any) {
				console.log("createUsername error", error)

				return {
					error: error.message
				}
			}
		}
	}
}

export default resolvers
