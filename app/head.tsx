const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function Head() {
  return (
    <>
      <link rel="icon" href={`${BASE_PATH}/favicon.ico`} sizes="any" />
      <link
        rel="icon"
        type="image/png"
        href={`${BASE_PATH}/favicon-32x32.png`}
        sizes="32x32"
      />
      <link
        rel="icon"
        type="image/png"
        href={`${BASE_PATH}/favicon-16x16.png`}
        sizes="16x16"
      />
      <link
        rel="apple-touch-icon"
        href={`${BASE_PATH}/apple-touch-icon.png`}
        sizes="180x180"
      />
    </>
  );
}
