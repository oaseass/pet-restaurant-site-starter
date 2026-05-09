export type PublicPlaceProfile = {
  description: string | null;
  openingHours: string | null;
  priceText: string | null;
  reservationUrl: string | null;
  serviceTags: string[];
  parkingAvailable: boolean | null;
  largeDogAllowed: boolean | null;
  catAllowed: boolean | null;
  indoorAllowed: boolean | null;
  outdoorAllowed: boolean | null;
  cageRequired: boolean | null;
  leashRequired: boolean | null;
  ownerUpdatedAt: string | null;
  updatedAt: string;
};

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 12);
}

export async function getPublicPlaceProfile(placeId: string, timeoutMs = 1500): Promise<PublicPlaceProfile | null> {
  const query = (async () => {
    const { prisma } = await import("@/lib/prisma");
    const profile = await prisma.placeProfile.findUnique({
      where: { placeId },
      select: {
        description: true,
        openingHours: true,
        priceText: true,
        reservationUrl: true,
        serviceTags: true,
        parkingAvailable: true,
        largeDogAllowed: true,
        catAllowed: true,
        indoorAllowed: true,
        outdoorAllowed: true,
        cageRequired: true,
        leashRequired: true,
        ownerUpdatedAt: true,
        updatedAt: true,
      },
    });

    if (!profile) return null;

    return {
      description: profile.description,
      openingHours: profile.openingHours,
      priceText: profile.priceText,
      reservationUrl: profile.reservationUrl,
      serviceTags: toStringArray(profile.serviceTags),
      parkingAvailable: profile.parkingAvailable,
      largeDogAllowed: profile.largeDogAllowed,
      catAllowed: profile.catAllowed,
      indoorAllowed: profile.indoorAllowed,
      outdoorAllowed: profile.outdoorAllowed,
      cageRequired: profile.cageRequired,
      leashRequired: profile.leashRequired,
      ownerUpdatedAt: profile.ownerUpdatedAt?.toISOString() ?? null,
      updatedAt: profile.updatedAt.toISOString(),
    } satisfies PublicPlaceProfile;
  })().catch(() => null);

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<null>((resolve) => {
    timeoutHandle = setTimeout(() => resolve(null), timeoutMs);
  });

  return Promise.race([query, timeoutPromise]).finally(() => {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  });
}
