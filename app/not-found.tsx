import { redirect } from "next/navigation";

export default function PageNotFound() {
    return redirect('/dashboard/fallback/custom404')
}