import { prisma } from "$lib/server/prisma";
import { createTOTPKeyURI } from "@oslojs/otp";
import { encodeHex } from "oslo/encoding";

export const update_two_factor_secret = async (
  userId: string,
  username: string,
  setNull: boolean = false,
) => {
  const totpKey = new Uint8Array(20);
  crypto.getRandomValues(totpKey);

  const keyURI = createTOTPKeyURI("Snapp", username, totpKey, 30, 6);
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      two_factor_secret: setNull ? null : encodeHex(totpKey),
    },
  });

  return keyURI;
};
