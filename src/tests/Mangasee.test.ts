import { Source } from "../sources/Source"
import cheerio from 'cheerio'
import { APIWrapper } from "../API"
import { Mangasee } from "../sources/Mangasee/Mangasee";

describe('Mangasee Tests', function () {

    var wrapper: APIWrapper = new APIWrapper();
    var source: Source = new Mangasee(cheerio);
    var chai = require('chai'), expect = chai.expect, should = chai.should();
    var chaiAsPromised = require('chai-as-promised');
    chai.use(chaiAsPromised);

    /**
     * The Manga ID which this unit test uses to base it's details off of.
     * Try to choose a manga which is updated frequently, so that the historical checking test can 
     * return proper results, as it is limited to searching 30 days back due to extremely long processing times otherwise.
     */
    var mangaId = "one-piece";

    it("Retrieve Manga Details", async () => {
        let details = await wrapper.getMangaDetails(source, [mangaId]);
        expect(details, "No results found with test-defined ID [" + mangaId + "]").to.be.an('array');
        expect(details).to.not.have.lengthOf(0, "Empty response from server");

        // Validate that the fields are filled
        let data = details[0];
        expect(data.id, "Missing ID").to.be.not.empty;
        expect(data.titles, "Missing titles").to.be.not.empty;
        expect(data.image, "Missing Image").to.be.not.empty;
        expect(data.rating, "Missing Rating").to.exist;
        expect(data.status, "Missing Status").to.exist;
        expect(data.author, "Missing Author").to.be.not.empty;
        expect(data.author, "Missing Tags").to.be.not.empty;
        expect(data.desc, "Missing Description").to.be.not.empty;
        expect(data.hentai, "Missing Hentai").to.exist
    });

    it("Get Chapters", async () => {
        let data = await wrapper.getChapters(source, mangaId);
        expect(data, "No chapters present for: [" + mangaId + "]").to.not.be.empty;
    });

    it("Get Chapter Details", async () => {

        let chapters = await wrapper.getChapters(source, mangaId);
        let data = await wrapper.getChapterDetails(source, mangaId, chapters[0].id);

        expect(data, "No server response").to.exist;
        expect(data, "Empty server response").to.not.be.empty;

        expect(data.id, "Missing ID").to.be.not.empty;
        expect(data.mangaId, "Missing MangaID").to.be.not.empty;
        expect(data.pages, "No pages present").to.be.not.empty;
    });

    it("Searching for Manga With Valid Tags", async () => {
        let testSearch = createSearchRequest({
            title: 'Radiation House',
            includeDemographic: ['Seinen']
        });

        let search = await wrapper.search(source, testSearch, 1);
        let result = search[0];

        expect(result, "No response from server").to.exist;

        expect(result.id, "No ID found for search query").to.be.not.empty;
        expect(result.image, "No image found for search").to.be.not.empty;
        expect(result.title, "No title").to.be.not.null;
        expect(result.subtitleText, "No subtitle text").to.be.not.null;
        expect(result.primaryText, "No primary text").to.be.not.null;
        expect(result.secondaryText, "No secondary text").to.be.not.null;

    });

    it("Searching for Manga With Invalid Tags", async () => {
        let testSearch = createSearchRequest({
            title: 'Ratiaion House',
            excludeDemographic: ['Seinen']
        });

        let search = await wrapper.search(source, testSearch, 1);
        let result = search[0];
        expect(result).to.not.exist;    // There should be no entries with this tag!
    });

    /**
     * Test to determine if update notifications are working.
     * Runs twice. Once with the current date, where it is expected that there will be no updates.
     * And then again, starting at the beginning of time. There definitely should be an update since then.
     */
    it("Filtering Updated Manga", async () => {
        let beforeDate = await wrapper.filterUpdatedManga(source, [mangaId], new Date());
        expect(beforeDate, "Empty response from server").to.be.empty;

        // Check for updates one month back
        let date = new Date();
        date.setDate(date.getDate() - 30);
        let afterDate = await wrapper.filterUpdatedManga(source, [mangaId], date);
        expect(afterDate, "No manga updated in the last month").to.not.be.empty;
    });
});