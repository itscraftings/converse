import { Skeleton } from "@chakra-ui/react"

interface SkeletonLoaderProps {
	count: number
	height: string
}

export default function SkeletonLoader({ count, height }: SkeletonLoaderProps) {
	return (
		<>
			{[...Array(count)].map((_, idx) => (
				<Skeleton
					key={idx}
					startColor="blackAlpha.400"
					endColor="whiteAlpha.300"
					height={height}
					width="full"
					borderRadius={4}
				/>
			))}
		</>
	)
}
