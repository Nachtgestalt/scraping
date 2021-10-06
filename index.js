const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const url = 'https://ojp.puebla.gob.mx';
let linkList = [];
let dlinkList = [];

const getWebsiteLinks = async (url) => {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        $('li.uk-width-medium-1-4').each(function (i, elem) {
            let link = $(elem).find('a').attr('href');
            if (!link.includes('dof')) {
                linkList.push(url + link);
            }
        });
        // console.log(linkList);
    } catch (error) {
        console.error(error);
    }
};

// const getWebsiteLinks = async (url) => {
//     try {
//         const response = await axios.get(url);
//         const $ = cheerio.load(response.data);
//         $('article').each(function (i, elem) {
//             let name = $(elem).find('header').text();
//             name = name
//                 .replace(/[^a-zA-Z ]/g, '')
//                 .trimStart()
//                 .trimEnd()
//                 .replace(/\s/g, '_');
//             let link = $(elem).find('a.element-download-button').attr('href');
//             console.log(link);
//             linkList.push({
//                 name,
//                 url: url + link,
//             });
//             // console.log(link);
//         });
//         console.log(linkList);
//     } catch (error) {
//         console.error(error);
//     }
// };

const visitSections = async () => {
    for (const linkToSection of linkList) {
        let totalPages = 1;
        try {
            const response = await axios.get(linkToSection);
            const $ = cheerio.load(response.data);
            totalPages = await getTotalPages($);
            for(let i = 1; i <= totalPages; i++) {
                let nextPageLink = `${linkToSection}/${i}`;
                console.log(nextPageLink);
                
                setTimeout(() => {
                    downloadLinks(nextPageLink); // Call itself
                }, 3000);
            }
        }
        catch(error) {
            console.log(error);
        }
        
    }
    // fs.writeFile('links.json', JSON.stringify(dlinkList), 'utf8', (err) => {
    //     if (err) throw err;
    //     console.log('complete');
    // });
    console.log(dlinkList);
}

const downloadLinks = async (url) => {
    try{
        $('article').each(function (i, elem) {
            let name = $(elem).find('header').text();
            name = name
                .replace(/[^a-zA-Z ]/g, '')
                .trimStart()
                .trimEnd()
                .replace(/\s/g, '_');
            let link = $(elem)
                .find('a.element-download-button')
                .attr('href');

            dlinkList.push({
                name: name,
                dlink: url + link,
            });
        });
    } catch (error) {
        console.log(error);
    }
};

const downloadFiles = async (dlinkList) => {
    for (const link of dlinkList) {
        let name = link.name + '.pdf';
        let url = link.dlink;
        let file = fs.createWriteStream(name);
        console.log(url);
        try {
            if (url !== undefined) {
                const response = await axios({
                    url,
                    method: 'GET',
                    responseType: 'stream',
                });
                response.data.pipe(file);
            }
        } catch (error) {
            console.log(error);
        }
    }
};

const getTotalPages = async (data) => {
    try {
        let lastPage = data('div.pagination').find('a.last').attr('href');
        if (lastPage === undefined) {
            return 1;
        }
        const responseLastPage = await axios.get(url + lastPage);
        const $lastPage = cheerio.load(responseLastPage.data);
        let lastIndex = $lastPage('div.pagination').find('strong').text();
        console.log(lastIndex);
        return lastIndex;
    } catch (error) {
        console.log(error);
    }
};

(async () => {
    await getWebsiteLinks(url);
    await visitSections(linkList);
    await downloadFiles(dlinkList);
})();
