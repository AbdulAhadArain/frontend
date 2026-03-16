'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useTheme } from 'next-themes';

interface GoogleLoginButtonProps {
  onSuccess: (idToken: string) => void;
  onError: () => void;
}

export function GoogleLoginButton({
  onSuccess,
  onError
}: GoogleLoginButtonProps) {
  const { resolvedTheme } = useTheme();

  return (
    <div className='flex w-full items-center justify-center [&>div]:w-full'>
      <GoogleLogin
        onSuccess={(response) => {
          if (response.credential) {
            onSuccess(response.credential);
          }
        }}
        onError={onError}
        theme={resolvedTheme === 'dark' ? 'filled_black' : 'outline'}
        size='large'
        width='400'
        shape='rectangular'
        text='continue_with'
      />
    </div>
  );
}
