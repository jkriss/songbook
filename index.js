import fs from 'fs'
import path from 'path'
import pdf from 'pdfjs'
import Chords from 'simplechordpro'
const { parseCP } = Chords

function convert(songSrc) {
    let song = parseCP(songSrc.trim())
    song = song.replace(/[{}]/g, '')
    song = song.replace('subtitle:', '')
    song = song.replace('title:', '')
    return song
}

function splitMeta(str) {
    const idx = str.indexOf('\n\n')
    return [str.slice(0, idx), str.slice(idx + 1)]
}

function makeSongbook() {

    const mono = new pdf.Font(fs.readFileSync('./fonts/source-code-pro/SourceCodePro-Medium.ttf'))
    const titleFont = new pdf.Font(fs.readFileSync('./fonts/source-sans-pro/SourceSansPro-SemiBold.otf'))
    const tocFont = new pdf.Font(fs.readFileSync('./fonts/source-sans-pro/SourceSansPro-Regular.otf'))

    const doc = new pdf.Document({
        font: mono,
        padding: 30,
    })
    doc.pipe(fs.createWriteStream('songbook.pdf'))


    const songFiles = fs.readdirSync('songs').sort()


    doc.text('Songs', { font: titleFont, fontSize: 24 })
    doc.destination('toc')
    doc.text(' \n')

    for (const f of songFiles) {
        const songSrc = fs.readFileSync(['songs', f].join(path.sep), 'utf-8')
        const song = convert(songSrc)

        // grab the title and maybe artist
        const [meta] = splitMeta(song)
        const [title, artist] = meta.split('\n')

        const t = doc.text(title, {
            font: titleFont,
            fontSize: 18,
            lineHeight: 1.5,
            goTo: f
        })
        if (artist) {
            t.add(artist, {
                font: tocFont,
                fontSize: 18,
                lineHeight: 1.5,
                goTo: f
            })
        }
    }

    for (const f of songFiles) {

        const songSrc = fs.readFileSync(['songs', f].join(path.sep), 'utf-8')
        const song = convert(songSrc)

        // grab the title and maybe artist
        const [meta, content] = splitMeta(song)
        const [title, artist] = meta.split('\n')

        doc.pageBreak()
        doc.destination(f)

        doc.text(title, { font: titleFont, fontSize: 24 })
        if (artist) {
            doc.text(artist, { font: titleFont, fontSize: 18 })
        }

        doc.text(' \n')

        doc.text(content.trim(), { fontSize: 14, lineHeight: 1.5 })

        doc.text(' \n\n')
        doc.text('Back to song list', { font: titleFont, fontSize: 12, goTo: 'toc' })
    }

    doc.end()

}

makeSongbook()