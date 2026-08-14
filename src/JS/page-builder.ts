import { formatBlogDate } from "./blog-viewer";

export class Config {
    requires: string;
    args: any;

    constructor(config: Config) {
        this.requires = config.requires;
        this.args = config.args;
    }
}

export class DataRequest {
    name: string;
    requestURL: string;
    requestParams: string[];

    constructor(name: string = '', requestURL: string = '', requestParams: string[] = []) {
        this.name = name;
        this.requestURL = requestURL;
        this.requestParams = requestParams;
    }
}

class DataPayload {
    name: string;
    payload: any;

    constructor(name: string) {
        this.name = name;
    }
}

const has = (val: any) => val !== undefined;

const getDaySuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th';

    switch(day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

const formatDate = (timestamp: string, dateFormat: string) => {
    if (dateFormat === undefined) {
        return formatBlogDate(timestamp); // Default format
    }

    const date = new Date(timestamp);

    if (isNaN(date.getTime())) return "Invalid date";

    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'numeric' });
    const year = date.getFullYear();

    if (dateFormat === 'GR-U') {
        const result = `${month}.${day}.${year}`;
        const whitespace = new Array(13 - result.length).join(' ');
        
        return whitespace.concat(result);
    }
}

export const requestData = async (url: string, ...params: string[]) => {
    try {
        const searchParams = new URLSearchParams(window.location.search);
        
        let query = '';
        params.forEach(p => {
            const value = searchParams.get(p);
            if (p) {
                query += `${(query === '' ? '?' : '&')}${p}=${value}`;
            }
        });
        url += query;

        const result = await fetch(url);

        if (!result.ok) {
            throw new Error(`Failed to fetch item(s).`);
        }

        return await result.json();
    } catch (e) {
        console.log(e);
        return null;
    }
}

const buildList = (list: HTMLUListElement, config: Config, ...data: DataPayload[]) => {
    if (!list) {
        console.error('buildList(): Valid list not found');
        return;
    }
    
    const generateListItem = (payload: DataPayload) => {
        const li = document.createElement('li');
        
        console.log('Payload:', payload);

        for (const node of config.args) {
            console.log(`Node:`, node);
            const element = generate(node, '', payload);

            if (element) {
                li.append(element);
            }
        }
        
        return li;
    };

    // Populate the list with each item listed in the payload
    list.append(...data.map((i: any) => generateListItem({
        name: config.requires,
        payload: i[0] // The first index should always be the target item
    })));
};

const functions: { 
    [key: string]: (element: HTMLElement, config: Config, ...data: DataPayload[]) => void 
} = {
    'list': (element: HTMLElement, config: Config, ...data: DataPayload[]) => {
        buildList(element as HTMLUListElement, config, ...data)
    }
};

const defineElement = (element: HTMLElement, node: any, payloadData: any) => {
    if (payloadData && has(node.requires)) {
        node.textContent = payloadData[node.textContent] || node.textContent;
    }

    if (has(node.textContent)) {
        let text = node.textContent || '';

        if (has(node.type)) {
            if (node.type === 'date') {
                text = formatDate(node.textContent, node.dateFormat);
            }
        }

        element.textContent = text;
    }

    if (has(node.classList)) {
        element.className = node.classList;
    }
    
    if (has(node.href)) {
        (element as HTMLAnchorElement).href = node.href;
    }

    if (has(node.function)) {
        const config: Config = { requires: node.requires, args: node.args };

        functions[node.function](element, config, payloadData);
    }
}

const generate = (node: any, id: string, ...requests: DataPayload[]): HTMLElement | null => {
    const element: HTMLElement = document.getElementById(id) || document.createElement(node.tag);

    if (has(id)) {
        element.id = id;
    }

    if (!element) {
        console.error('Invalid tag during element creation:', node.tag);
        return null;
    }

    let data; // Null by default

    if (has(node.requires)) {
        data = requests.find(r => r.name === node.requires)?.payload;
    }

    defineElement(element, node, data);

    // Add child nodes if any
    if (has(node.children)) {
        const children = node.children.map((n: any) => generate(n, '', ...requests));
        element.append(...children);
    }

    return element;
} 

export const buildScripts = async (template: any, ...requests: DataRequest[]) => {
    // Grab all server requests at the start so everything is ready. Remove the bad results
    const requestResults: DataPayload[] = (await Promise.all(
        requests.map(async req => {
            const result = await requestData(req.requestURL, ...req.requestParams);
            return result ? { name: req.name, payload: result } : null;
        }))
    ).filter((item) => item !== null);
    
    // Generate all objects from the template
    for (const [id, value] of Object.entries(template)) {
        generate(value as any, id, ...requestResults);
    }
};