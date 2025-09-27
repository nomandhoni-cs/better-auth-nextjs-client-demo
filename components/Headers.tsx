import { headers } from 'next/headers'

export default async function Headers() {
    const headersList = await headers()
    // console.log(headersList, "headersList")
    // const userAgent = headersList.get('user-agent')
    // console.log(userAgent)
    return (
        <div>

        </div>
    )
}