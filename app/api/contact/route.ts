import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

type ContactPayload = {
  name?: string;
  email?: string;
  contactUs?: string;
  projectType?: string;
  details?: string;
};

const REQUIRED_ENV = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"];

function getMissingEnvVars(): string[] {
  return REQUIRED_ENV.filter((key) => !process.env[key]);
}

export async function POST(request: Request) {
  const missingEnvVars = getMissingEnvVars();
  if (missingEnvVars.length > 0) {
    return NextResponse.json(
      {
        error: `Missing SMTP config: ${missingEnvVars.join(", ")}`,
      },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as ContactPayload;

    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim();
    const contactUs = (body.contactUs ?? "").trim();
    const projectType = (body.projectType ?? "").trim();
    const details = (body.details ?? "").trim();

    if (!name || !email || !contactUs || !projectType || !details) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const smtpPort = Number(process.env.SMTP_PORT);
    const secure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const toEmail = process.env.CONTACT_TO_EMAIL ?? "vardaanbuildersandcontractors@gmail.com";
    const fromEmail = process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER;

    await transporter.sendMail({
      from: `Vardaan Website <${fromEmail}>`,
      to: toEmail,
      replyTo: email,
      subject: `New Get In Touch Inquiry - ${projectType}`,
      text: [
        "New inquiry from website contact form",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Contact Us: ${contactUs}`,
        `Project Type: ${projectType}`,
        "",
        "Project Details:",
        details,
      ].join("\n"),
      html: `
        <h2>New inquiry from website contact form</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Contact Us:</strong> ${contactUs}</p>
        <p><strong>Project Type:</strong> ${projectType}</p>
        <p><strong>Project Details:</strong></p>
        <p>${details.replace(/\n/g, "<br/>")}</p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to send email right now" },
      { status: 500 }
    );
  }
}
