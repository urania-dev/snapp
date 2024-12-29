import { prisma } from "$lib/server/prisma";
import { createTOTPKeyURI } from "@oslojs/otp";
import { encodeHex } from "oslo/encoding";

export const update_two_factor_secret = async (
  userId: string,
  totpKey: string,
  setNull = false
) => {


  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      two_factor_secret: setNull ? null : totpKey
    },
  });

  return true;
};

export const generate_two_factor_secret_only = async (
  username: string,
  setNull = false
) => {
  const totpKey = new Uint8Array(20);
  crypto.getRandomValues(totpKey);
  const encrypted = setNull ? null : encodeHex(totpKey)

  const keyURI = createTOTPKeyURI("Snapp", username, totpKey, 30, 6);

  return [keyURI, encrypted] as [string, string | null];
};
