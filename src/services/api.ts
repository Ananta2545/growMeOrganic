import axios from "axios";

const api = "https://api.artic.edu/api/v1/artworks";

export const fetchApi = async(page: number) => {
    const res = await axios.get(`${api}?page=${page}`);
    return res.data;
}