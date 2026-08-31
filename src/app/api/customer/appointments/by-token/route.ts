import { prisma } from '@/lib/prisma';
import { error, ok } from '@/lib/http';

export async function GET(
  req: Request
) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return error('Booking token is required', 400);
  }

  const appointment = await prisma.appointment.findUnique({
    where: {
      bookingToken: token,
    },
    include: {
      service: true,
      tenant: true,
    },
  });

  if (!appointment) {
    return error('Booking not found', 404);
  }

  return ok({ appointment });
}

export async function POST(
  req: Request
) {
  const body = await req.json().catch(() => null);
  const token = body?.token;

  if (!token) {
    return error('Booking token is required', 400);
  }

  const appointment = await prisma.appointment.findUnique({
    where: {
      bookingToken: token,
    },
  });

  if (!appointment) {
    return error('Booking not found', 404);
  }

  if (appointment.status === 'CANCELLED') {
    return error('Booking is already cancelled', 400);
  }

  const updatedAppointment = await prisma.appointment.update({
    where: {
      id: appointment.id,
    },
    data: {
      status: 'CANCELLED',
    },
  });

  return ok({
    appointment: updatedAppointment,
  });
}