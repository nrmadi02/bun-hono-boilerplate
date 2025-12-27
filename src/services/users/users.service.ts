import prisma from "prisma";

export const findUserById = async (id: string) => {
	return prisma.user.findUnique({
		where: { id },
	});
};

export const updateUserRole = async (id: string, role: string) => {
	return prisma.user.update({
		where: { id },
		data: { role },
	});
};
