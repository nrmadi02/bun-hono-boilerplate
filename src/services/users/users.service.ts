import prisma from "prisma";

export interface IListUserParams {
	limit: number;
	page: number;
}

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

export const getListUser = async (params: IListUserParams) => {
	const { limit, page } = params;
	return prisma.user.paginate().withPages({
		limit,
		page,
		includePageCount: true,
	});
};
