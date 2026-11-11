import { redirect } from "next/navigation";

type HomeProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { token } = await searchParams;

  // Links de abonos enviados antes de mover la silletería a /tribuna
  // seguían usando /?token=XXX#silleteria — los redirigimos para que no queden rotos.
  if (token) {
    redirect(`/tribuna?token=${encodeURIComponent(token)}`);
  }

  redirect("/boletas");
}
