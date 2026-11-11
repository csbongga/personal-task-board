import { getBoardDataAction } from "@/app/actions";
import { Board } from "@/components/Board";

export const dynamic = "force-dynamic";

export default async function Page() {
  const initialData = await getBoardDataAction();
  return <Board initialData={initialData} />;
}
