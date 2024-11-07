const config = require('./config');
const { TonClient, WalletContractV4, Cell } = require('@ton/ton'); // Импортируем необходимые классы из @ton/ton
const { mnemonicToPrivateKey } = require('ton-crypto'); // Импортируем функцию для получения ключевой пары из мнемонической фразы
// const { NftCollection } = require('@ton/index'); // Импортируем NftCollection
(async () => {
    // Создаем экземпляр TonClient с HTTP провайдером для подключения к блокчейну TON
    const client = new TonClient({
        endpoint: config.TON_API_URL_TEST,
        apiKey: config.TONCENTER_API_KEY_TEST
    });

    // Инициализируем кошелек
    const wallet = await getWallet(client);
    console.log("Адрес кошелька для деплоя:", wallet.address.toString());

    console.log("Деплой смарт-контракта NFT коллекции в основной сети...");

    // Получаем код NFT коллекции
    const nftCollectionCode = getNFTCollectionCode();
    // Получаем данные для контракта
    const contractData = await getContractData(wallet.address, wallet.address);

    // Создаем экземпляр NFT коллекции
    const nftCollection = new NftCollection(client, {
        ownerAddress: wallet.address, // Адрес владельца коллекции
        nftItemCodeHex: getNFTItemCode().toBoc().toString('hex'), // Код NFT элемента в формате HEX
        royaltyParams: {
            royaltyFactor: 5, // Процент роялти (5%)
            royaltyBase: 100, // Базовое значение для расчета роялти
            royaltyAddress: wallet.address // Адрес получения роялти
        },
        content: {
            collectionContentUri: config.COLLECTION_CONTENT_URI, // URI контента коллекции
            commonContent: config.COMMON_CONTENT_URL // Общий контент для элементов коллекции
        }
    });

    // Создаем сообщение для деплоя контракта
    const deployMessage = await nftCollection.createDeployMessage();

    // Получаем текущий seqno кошелька
    const seqno = await client.getSeqno(wallet.address);
    // Отправляем транзакцию для деплоя контракта
    await client.sendTransaction({
        secretKey: wallet.keyPair.secretKey, // Секретный ключ кошелька
        toAddress: nftCollection.address, // Адрес контракта NFT коллекции
        amount: TonClient.utils.toNano('0.02'), // Сумма для деплоя (0.02 TON)
        seqno: seqno, // Текущий seqno
        payload: deployMessage.data, // Данные для деплоя контракта
        sendMode: 3 // Режим отправки
    });

    console.log("Контракт успешно задеплоен по адресу:", nftCollection.address.toString());
})();

async function getWallet(client) {
    // Получаем ключевую пару из мнемонической фразы
    const keyPair = await mnemonicToPrivateKey(config.MNEMONIC);

    // Создаем кошелек (v4R2)
    const wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: keyPair.publicKey,
    });
    const contract = client.open(wallet); // Открываем контракт кошелька

    return contract; // Возвращаем контракт кошелька
}

function getNFTCollectionCode() {
    // HEX строка, представляющая BOC код NFT коллекции
    const hexBOC = "b5ee9c724102140100021f000114ff00f4a413f4bcf2c80b0102016202030202cd04050201200e0f04e7d10638048adf000e8698180b8d848adf07d201800e98fe99ff6a2687d20699fea6a6a184108349e9ca829405d47141baf8280e8410854658056b84008646582a802e78b127d010a65b509e58fe59f80e78b64c0207d80701b28b9e382f970c892e000f18112e001718112e001f181181981e0024060708090201200a0b00603502d33f5313bbf2e1925313ba01fa00d43028103459f0068e1201a44343c85005cf1613cb3fccccccc9ed54925f05e200a6357003d4308e378040f4966fa5208e2906a4208100fabe93f2c18fde81019321a05325bbf2f402fa00d43022544b30f00623ba9302a402de04926c21e2b3e6303250444313c85005cf1613cb3fccccccc9ed54002c323401fa40304144c85005cf1613cb3fccccccc9ed54003c8e15d4d43010344130c85005cf1613cb3fccccccc9ed54e05f04840ff2f00201200c0d003d45af0047021f005778018c8cb0558cf165004fa0213cb6b12ccccc971fb008002d007232cffe0a33c5b25c083232c044fd003d0032c03260001b3e401d3232c084b281f2fff2742002012010110025bc82df6a2687d20699fea6a6a182de86a182c40043b8b5d31ed44d0fa40d33fd4d4d43010245f04d0d431d430d071c8cb0701cf16ccc980201201213002fb5dafda89a1f481a67fa9a9a860d883a1a61fa61ff480610002db4f47da89a1f481a67fa9a9a86028be09e008e003e00b01a500c6e";
    // Преобразуем HEX строку в ячейку кода
    const codeCell = Cell.fromBoc(Buffer.from(hexBOC, 'hex'))[0];
    return codeCell; // Возвращаем ячейку кода NFT коллекции
}

function getNFTItemCode() {
    // HEX строка, представляющая BOC код NFT элемента
    const hexBOC = "b5ee9c7241020d010001d0000114ff00f4a413f4bcf2c80b0102016202030202ce04050009a11f9fe00502012006070201200b0c02d70c8871c02497c0f83434c0c05c6c2497c0f83e903e900c7e800c5c75c87e800c7e800c3c00812ce3850c1b088d148cb1c17cb865407e90350c0408fc00f801b4c7f4cfe08417f30f45148c2ea3a1cc840dd78c9004f80c0d0d0d4d60840bf2c9a884aeb8c097c12103fcbc20080900113e910c1c2ebcb8536001f65135c705f2e191fa4021f001fa40d20031fa00820afaf0801ba121945315a0a1de22d70b01c300209206a19136e220c2fff2e192218e3e821005138d91c85009cf16500bcf16712449145446a0708010c8cb055007cf165005fa0215cb6a12cb1fcb3f226eb39458cf17019132e201c901fb00104794102a375be20a00727082108b77173505c8cbff5004cf1610248040708010c8cb055007cf165005fa0215cb6a12cb1fcb3f226eb39458cf17019132e201c901fb000082028e3526f0018210d53276db103744006d71708010c8cb055007cf165005fa0215cb6a12cb1fcb3f226eb39458cf17019132e201c901fb0093303234e25502f003003b3b513434cffe900835d27080269fc07e90350c04090408f80c1c165b5b60001d00f232cfd633c58073c5b3327b5520bf75041b";
    // Преобразуем HEX строку в ячейку кода
    const codeCell = Cell.fromBoc(Buffer.from(hexBOC, 'hex'))[0];
    return codeCell; // Возвращаем ячейку кода NFT элемента
}

async function getContractData(collectionOwnerAddr, royaltyAddr) {
    // Создаем ячейку с параметрами роялти
    const royaltyCell = new Cell();
    royaltyCell.bits.writeUint(5, 16); // Фактор роялти (5%)
    royaltyCell.bits.writeUint(100, 16); // Базовое значение для роялти (100%)
    royaltyCell.bits.writeAddress(royaltyAddr); // Адрес получения роялти

    // Создаем ячейку с контентом коллекции
    const collectionContentCell = new Cell();
    collectionContentCell.bits.writeString(config.COLLECTION_CONTENT_URI); // URI контента коллекции

    // Создаем ячейку с общим контентом для NFT элементов
    const commonContentCell = new Cell();
    commonContentCell.bits.writeString(config.COMMON_CONTENT_URL); // Общий контент для NFT элементов

    // Создаем ячейку с ссылками на контент
    const contentRef = new Cell();
    contentRef.refs.push(collectionContentCell); // Ссылка на контент коллекции
    contentRef.refs.push(commonContentCell); // Ссылка на общий контент

    // Создаем ячейку с данными контракта
    const dataCell = new Cell();
    dataCell.bits.writeAddress(collectionOwnerAddr); // Адрес владельца коллекции
    dataCell.bits.writeUint(0, 64); // Индекс следующего элемента (начинаем с 0)
    dataCell.refs.push(contentRef); // Добавляем ссылки на контент
    dataCell.refs.push(getNFTItemCode()); // Добавляем код NFT элемента
    dataCell.refs.push(royaltyCell); // Добавляем параметры роялти

    return dataCell; // Возвращаем ячейку с данными контракта
}
