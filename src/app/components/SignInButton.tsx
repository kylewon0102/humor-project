type SignInButtonProps = {
  className?: string;
};

export default function SignInButton({ className }: SignInButtonProps) {
  return (
    <a href="/auth/start" className={className}>
      Connect with Google
    </a>
  );
}
