const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"; // Adjust your default port if needed
const countiesUrl = `${baseUrl}/counties`;
export const fetchStatesData = async () => {
  const response = await (await fetch(countiesUrl)).json();
  return response;
};
export default fetchStatesData;
