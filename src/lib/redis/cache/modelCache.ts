import redis from '..';

const getModelCache = async (UserId: string) => {
	const cache = redis.get(`model:${UserId}`);
	return cache;
};

const setModelCache = async (UserId: string, cache: any) => {
	await redis.set(`model:${UserId}`, cache);
};

const deleteModelCache = async (UserId: string) => {
	await redis.del(`model:${UserId}`);
};
export { getModelCache, setModelCache, deleteModelCache };
