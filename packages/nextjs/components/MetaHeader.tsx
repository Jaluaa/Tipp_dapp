// Create: packages/nextjs/components/MetaHeader.tsx
import Head from "next/head";

interface MetaHeaderProps {
  title?: string;
  description?: string;
}

export const MetaHeader = ({
  title = "Clapcoin - Simple Crypto Tipping",
  description = "Send tips to creators using ENS names",
}: MetaHeaderProps) => {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
    </Head>
  );
};
