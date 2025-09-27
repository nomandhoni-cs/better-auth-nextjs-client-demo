import { cookies } from "next/headers";
import { getSessionUtil } from "~/lib/getSession";


export default async function Session() {
    const session = await getSessionUtil();
    const cookieStore = await cookies()
    console.log(cookieStore, 'cookieStore');
    console.log(session, 'session');

    // if (!session) redirect("/auth/signin");

    return <div>Session</div>;
}
