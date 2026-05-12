'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 사업심사팀은 사업팀(/biz-ops)으로 통합되었습니다.
export default function Page() {
  const router = useRouter();
  useEffect(() => { router.replace('/biz-ops'); }, []);
  return null;
}
