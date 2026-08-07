import { getGetResponseSubscriberCount } from "@/lib/getresponse";

export async function SubscriberCount() {
  const subscribers = await getGetResponseSubscriberCount();
  if (subscribers == null || subscribers <= 0) return null;

  return (
    <p className="subscribe-count">
      {subscribers.toLocaleString("en-US")} {subscribers === 1 ? "person has" : "people have"} subscribed
    </p>
  );
}
