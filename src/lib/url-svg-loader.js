export default async function (baseUrl, character) {
    const characterCode = character.charCodeAt(0).toString(16)
    const url = `${baseUrl}0${characterCode}.svg`
    const response = await fetch(url)
    return await response.text()
}