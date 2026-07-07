import { NextRequest } from 'next/server';
import { handleMockApi } from '@/lib/mock/api-handlers';

type RouteContext = { params: { path?: string[] } };

async function dispatch(req: NextRequest, context: RouteContext, method: string) {
  const path = context.params.path ?? [];
  return handleMockApi(req, path, method);
}

export async function GET(req: NextRequest, context: RouteContext) {
  return dispatch(req, context, 'GET');
}

export async function POST(req: NextRequest, context: RouteContext) {
  return dispatch(req, context, 'POST');
}

export async function PUT(req: NextRequest, context: RouteContext) {
  return dispatch(req, context, 'PUT');
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  return dispatch(req, context, 'PATCH');
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  return dispatch(req, context, 'DELETE');
}
