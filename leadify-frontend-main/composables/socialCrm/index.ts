import { useApiFetch } from '~/composables/useApiFetch';

export const useSocialCrm = () => {
  const getProfiles = (params?: any) => useApiFetch('social-crm', 'GET', undefined, params);
  const getProfileById = (id: string | number) => useApiFetch(`social-crm/${id}`, 'GET');
  const createProfile = (data: any) => useApiFetch('social-crm', 'POST', data);
  const updateProfile = (id: string | number, data: any) => useApiFetch(`social-crm/${id}`, 'PUT', data);
  const deleteProfile = (id: string | number) => useApiFetch(`social-crm/${id}`, 'DELETE');
  const getPosts = (params?: any) => useApiFetch('social-crm/posts', 'GET', undefined, params);
  const createPost = (data: any) => useApiFetch('social-crm/posts', 'POST', data);
  const updatePost = (id: string | number, data: any) => useApiFetch(`social-crm/posts/${id}`, 'PUT', data);
  const deletePost = (id: string | number) => useApiFetch(`social-crm/posts/${id}`, 'DELETE');
  return { getProfiles, getProfileById, createProfile, updateProfile, deleteProfile, getPosts, createPost, updatePost, deletePost };
};
