import Gameplay from "../features/Gameplay"

export default async function Page({
    params,
  }: {
    params: Promise<{ slug: string }>
  }) {
    const slug = (await params).slug
    return <Gameplay roomId={slug}/>
  }