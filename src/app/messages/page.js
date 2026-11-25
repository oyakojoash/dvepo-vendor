import { MessageProvider } from "../Context/MessageContext";
import MessageInbox from "../Components/messages/MessageInbox";

export const metadata = {
  title: "Messages | Dvepo Vendor",
  description:
    "Manage customer conversations and communicate with Dvepo Administration.",
};

export default function MessagesPage() {
  return (
    <MessageProvider>
      <main className="min-h-screen bg-gray-50 px-3 py-5 dark:bg-gray-950 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto w-full max-w-[1600px]">
          <MessageInbox />
        </div>
      </main>
    </MessageProvider>
  );
}