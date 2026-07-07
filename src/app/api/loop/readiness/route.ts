import { NextResponse } from 'next/server';

export interface LoopReadinessStep {
  id: string;
  label: string;
  done: boolean;
  href: string;
  detail?: string;
}

export interface LoopReadinessResponse {
  complete: boolean;
  steps: LoopReadinessStep[];
}

export async function GET(): Promise<NextResponse> {
  const body: LoopReadinessResponse = {
    complete: false,
    steps: [
      { id: 'brain', label: 'Sync creator brain', done: true, href: '/settings' },
      { id: 'social', label: 'Connect LinkedIn', done: true, href: '/settings' },
      { id: 'publish', label: 'Publish a post', done: false, href: '/library' },
    ],
  };
  return NextResponse.json(body);
}
