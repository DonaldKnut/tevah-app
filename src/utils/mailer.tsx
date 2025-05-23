import React from "react";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { WelcomeEmail } from "../emails/WelcomeEmail";
import { VerificationEmail } from "../emails/VerificationEmail";
import { ResetPasswordEmail } from "../emails/ResetPasswordEmail";
import dotenv from "dotenv";
dotenv.config(); // Automatically loads from root of current working dir

// Interface for email options
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Initialize Resend client with validation
const resend = (() => {
  const apiKey = process.env.RESEND_API_KEY!;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not defined. Please set it in your .env file."
    );
  }
  return new Resend(apiKey);
})();

// Centralized email sending function
const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "Tevah App <support@tevahapp.com>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error(`Failed to send email to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw error instanceof Error
      ? error
      : new Error("Unknown email sending error");
  }
};

export const sendWelcomeEmail = async (email: string, firstName: string) => {
  const html = await render(<WelcomeEmail firstName={firstName} />);
  return sendEmail({
    to: email,
    subject: "Welcome to Tevah 🎉",
    html,
  });
};

export const sendVerificationEmail = async (
  email: string,
  firstName: string,
  code: string
) => {
  const html = await render(
    <VerificationEmail firstName={firstName} code={code} />
  );
  return sendEmail({
    to: email,
    subject: "Verify Your Email Address",
    html,
  });
};

export const sendResetPasswordEmail = async (
  email: string,
  firstName: string,
  resetLink: string
) => {
  const html = await render(
    <ResetPasswordEmail firstName={firstName} resetLink={resetLink} />
  );
  return sendEmail({
    to: email,
    subject: "Reset Your Password",
    html,
  });
};
