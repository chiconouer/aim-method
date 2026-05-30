import type { CSSProperties } from "react";

/**
 * The certificate is rendered at NATIVE 1200x850 px so html-to-image can
 * capture a crisp PNG at print resolution. The page scales it down with
 * CSS transform for on-screen display while the underlying DOM stays at
 * native size. All styles inline so html-to-image serializes them reliably.
 */
export const CERT_WIDTH = 1200;
export const CERT_HEIGHT = 850;
export const CERT_RENDER_ID = "certificate-render";

interface CertificateProps {
  name: string;
  date: string;
}

const bebas: CSSProperties = {
  fontFamily: "'Bebas Neue', 'Impact', sans-serif",
  fontWeight: 400,
};

const serif: CSSProperties = {
  fontFamily: "'Georgia', 'Times New Roman', serif",
};

export function Certificate({ name, date }: CertificateProps) {
  return (
    <div
      id={CERT_RENDER_ID}
      style={{
        width: CERT_WIDTH,
        height: CERT_HEIGHT,
        position: "relative",
        background:
          "radial-gradient(ellipse at top, #1a1233 0%, #0a0a0a 55%, #050505 100%)",
        color: "#ffffff",
        overflow: "hidden",
      }}
    >
      {/* Corner ambient glows */}
      <div
        style={{
          position: "absolute",
          top: -160,
          left: -160,
          width: 480,
          height: 480,
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.22) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -180,
          right: -180,
          width: 520,
          height: 520,
          background:
            "radial-gradient(circle, rgba(109, 40, 217, 0.22) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Decorative double border */}
      <div
        style={{
          position: "absolute",
          top: 30,
          left: 30,
          right: 30,
          bottom: 30,
          border: "2px solid rgba(139, 92, 246, 0.35)",
          borderRadius: 6,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 42,
          left: 42,
          right: 42,
          bottom: 42,
          border: "1px solid rgba(139, 92, 246, 0.15)",
          borderRadius: 3,
          pointerEvents: "none",
        }}
      />

      {/* Corner flourishes */}
      <CornerFlourish style={{ top: 60, left: 60 }} />
      <CornerFlourish style={{ top: 60, right: 60 }} rotation={90} />
      <CornerFlourish style={{ bottom: 60, right: 60 }} rotation={180} />
      <CornerFlourish style={{ bottom: 60, left: 60 }} rotation={270} />

      {/* Content stack */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "90px 100px 80px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Medallion */}
        <Medallion />

        {/* Brand wordmark */}
        <p
          style={{
            ...bebas,
            fontSize: 18,
            letterSpacing: "0.55em",
            color: "#a78bfa",
            marginTop: 18,
            marginBottom: 0,
            paddingLeft: "0.55em",
          }}
        >
          AIM METHOD
        </p>

        {/* Title */}
        <h1
          style={{
            ...bebas,
            fontSize: 68,
            letterSpacing: "0.1em",
            margin: "28px 0 0",
            color: "#ffffff",
            lineHeight: 1,
            paddingLeft: "0.1em",
          }}
        >
          Certificate of Completion
        </h1>

        {/* "This certifies that" */}
        <p
          style={{
            ...serif,
            fontStyle: "italic",
            fontSize: 20,
            color: "#9ca3af",
            margin: "44px 0 0",
          }}
        >
          This certifies that
        </p>

        {/* Student name — gradient text */}
        <p
          style={{
            ...bebas,
            fontSize: 90,
            margin: "12px 0 0",
            lineHeight: 1,
            letterSpacing: "0.04em",
            backgroundImage:
              "linear-gradient(135deg, #c4b5fd 0%, #a78bfa 35%, #8b5cf6 65%, #6d28d9 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
            paddingLeft: "0.04em",
            paddingBottom: 6,
          }}
        >
          {name}
        </p>

        {/* Completion line */}
        <p
          style={{
            ...serif,
            fontStyle: "italic",
            fontSize: 20,
            color: "#9ca3af",
            margin: "16px 0 0",
          }}
        >
          has successfully completed the AIM Method course
        </p>

        {/* Divider with diamond */}
        <DiamondDivider />

        {/* Footer row */}
        <div
          style={{
            marginTop: "auto",
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            padding: "0 40px",
          }}
        >
          <FooterColumn label="Awarded on" value={date} />
          <FooterColumn label="Signed by" value="Professor Nouer" italic />
        </div>

        <p
          style={{
            ...serif,
            fontSize: 13,
            color: "#6b7280",
            letterSpacing: "0.2em",
            marginTop: 26,
            paddingLeft: "0.2em",
          }}
        >
          aimodelmethods.com
        </p>
      </div>
    </div>
  );
}

function Medallion() {
  return (
    <svg
      width={96}
      height={96}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="medal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      {/* Outer ring */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="none"
        stroke="rgba(139, 92, 246, 0.4)"
        strokeWidth="1"
      />
      {/* Inner filled disc */}
      <circle cx="50" cy="50" r="40" fill="url(#medal-grad)" />
      {/* Subtle inner ring */}
      <circle
        cx="50"
        cy="50"
        r="36"
        fill="none"
        stroke="rgba(255, 255, 255, 0.35)"
        strokeWidth="0.8"
      />
      {/* Star points around the medallion (4 cardinal accents) */}
      {[0, 90, 180, 270].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x = 50 + Math.cos(rad) * 44;
        const y = 50 + Math.sin(rad) * 44;
        return (
          <circle
            key={angle}
            cx={x}
            cy={y}
            r="1.5"
            fill="rgba(167, 139, 250, 0.8)"
          />
        );
      })}
      {/* AIM wordmark */}
      <text
        x="50"
        y="59"
        textAnchor="middle"
        fontSize="22"
        fontWeight="800"
        fill="#ffffff"
        fontFamily="'Bebas Neue', 'Impact', sans-serif"
        letterSpacing="2"
      >
        AIM
      </text>
    </svg>
  );
}

function DiamondDivider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        marginTop: 36,
        width: 260,
      }}
    >
      <span
        style={{
          flex: 1,
          height: 1,
          background:
            "linear-gradient(to right, transparent, rgba(139, 92, 246, 0.5))",
        }}
      />
      <svg width="14" height="14" viewBox="0 0 14 14">
        <polygon
          points="7,0 14,7 7,14 0,7"
          fill="none"
          stroke="rgba(167, 139, 250, 0.8)"
          strokeWidth="1.5"
        />
      </svg>
      <span
        style={{
          flex: 1,
          height: 1,
          background:
            "linear-gradient(to left, transparent, rgba(139, 92, 246, 0.5))",
        }}
      />
    </div>
  );
}

function FooterColumn({
  label,
  value,
  italic,
}: {
  label: string;
  value: string;
  italic?: boolean;
}) {
  return (
    <div style={{ textAlign: "center", minWidth: 200 }}>
      <p
        style={{
          ...serif,
          fontStyle: italic ? "italic" : "normal",
          fontSize: 22,
          color: "#ffffff",
          margin: 0,
          paddingBottom: 8,
          borderBottom: "1px solid rgba(139, 92, 246, 0.35)",
        }}
      >
        {value}
      </p>
      <p
        style={{
          ...serif,
          fontSize: 12,
          color: "#6b7280",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginTop: 8,
          marginBottom: 0,
          paddingLeft: "0.2em",
        }}
      >
        {label}
      </p>
    </div>
  );
}

function CornerFlourish({
  style,
  rotation = 0,
}: {
  style: CSSProperties;
  rotation?: number;
}) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      style={{
        position: "absolute",
        ...style,
        transform: `rotate(${rotation}deg)`,
        pointerEvents: "none",
      }}
    >
      <path
        d="M0 12 Q0 0 12 0"
        fill="none"
        stroke="rgba(139, 92, 246, 0.6)"
        strokeWidth="1.5"
      />
      <circle cx="0" cy="0" r="2" fill="rgba(167, 139, 250, 0.9)" />
    </svg>
  );
}
