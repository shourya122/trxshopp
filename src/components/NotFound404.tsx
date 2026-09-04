import { useEffect } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import bg from "@/assets/404-space.png";

type Props = {
  title?: string;
  subtitle?: string;
};

export function NotFound404({ title, subtitle }: Props) {
  const router = useRouter();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // image native aspect ratio: 1920x1152
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#0d1024",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "100vw",
          aspectRatio: "1920 / 1152",
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        aria-label={title ? `${title} ${subtitle ?? ""}` : "404 page not found"}
      >
        {/* Invisible click targets aligned over the GO HOME / GO BACK buttons in the artwork.
            Coordinates are percentages of the 1920x1152 image. */}
        <Link
          to="/"
          aria-label="Go home"
          style={{
            position: "absolute",
            left: "41.1%",
            top: "75.0%",
            width: "9.5%",
            height: "3.7%",
            borderRadius: 4,
          }}
        />
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.history.back()}
          style={{
            position: "absolute",
            left: "51.6%",
            top: "75.0%",
            width: "9.7%",
            height: "3.7%",
            background: "transparent",
            border: 0,
            cursor: "pointer",
            borderRadius: 4,
          }}
        />
      </div>
    </div>
  );
}
