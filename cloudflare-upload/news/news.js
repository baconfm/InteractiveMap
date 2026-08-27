const list = document.querySelector("#news-list");
const statusUpdated = document.querySelector("#project-status-updated");
const statusRegions = document.querySelector("#project-status-regions");
const formatDate = (date) => new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(`${date}T12:00:00`));

fetch("posts.json", { cache: "no-store" }).then((response) => response.json()).then((posts) => {
  posts.forEach(({ date, title, body }) => {
    const article = document.createElement("article");
    article.className = "news-entry";
    const time = document.createElement("time");
    time.dateTime = date;
    time.textContent = formatDate(date);
    const heading = document.createElement("h2");
    heading.textContent = title;
    article.append(time, heading, ...body.map((text) => Object.assign(document.createElement("p"), { textContent: text })));
    list.append(article);
  });
}).catch(() => { list.textContent = "News posts could not be loaded."; });

fetch("project-status.json", { cache: "no-store" }).then((response) => response.json()).then(({ date, regions }) => {
  statusUpdated.textContent = `Last updated ${formatDate(date)}`;
  Object.entries(regions).forEach(([region, value]) => {
    const entry = document.createElement("div");
    entry.append(Object.assign(document.createElement("span"), { textContent: region }), Object.assign(document.createElement("strong"), { textContent: value }));
    statusRegions.append(entry);
  });
});
