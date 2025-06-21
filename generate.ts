import fs, { writeFileSync } from "fs"

const groups = [
  [
    "Cloud Integration",
    [
      "nf-amazon",
      "nf-azure",
      "nf-google",
      "nf-tencentcloud",
      "nf-snowflake",
      "nf-codecommit",
      "nf-quilt",
      "nf-cloudcache",
    ],
  ],
  [
    "Executors and Orchestration",
    ["nf-ignite", "nf-k8s", "nf-nomad", "nf-jarvice", "nf-wr", "yellowdog", "nf-float"],
  ],
  [
    "Optimization and Performance Utilities",
    ["nf-boost", "nf-cloudcache", "nf-pgcache", "nf-parquet"],
  ],
  [
    "Data and Analysis Tools",
    ["nf-sqldb", "nf-ffq", "nf-schema", "nf-validation", "nf-prov", "nf-ga4gh"],
  ],
  [
    "Development and Debugging Support",
    ["nf-cachebrowser", "nf-console", "nf-dotenv", "nf-datatrail", "nf-hello"],
  ],
  ["Sustainability and Environment", ["nf-co2footprint"]],
  [
    "Specialized Integrations",
    ["nf-tower", "nf-cws", "nf-iridanext", "nf-wave", "nf-weblog", "nf-gpt"],
  ],
  ["Others", [""]],
]

interface Release {
  version: string
  url: string
  date: string
  requires: string
}

interface Plugin {
  id: string
  releases: Release[]
  readme: string
}

const groupSlup = (group: string) => {
  if (group == "") group = "others"
  return group.replace(/ /g, "-").toLowerCase()
}

const getPlugins = async (): Promise<Plugin[]> => {
  const res = await fetch("https://raw.githubusercontent.com/nextflow-io/plugins/main/plugins.json")
  const json = await res.json()
  return json as Plugin[]
}

const dumpPlugin = async (plugin: Plugin, token:string) => {
  console.log(`Creating plugin ${plugin.id}`)

  const groupEntry = groups.filter((g) => g[1].includes(plugin.id))[0]
  const group = groupEntry ? groupEntry[0] : ""
  const parts = (plugin.releases[0] || { url: "" }).url.split("/")
  const org = parts[3]
  const repo = parts[4]
  const date = (plugin.releases.findLast((r) => r) || { date: "" }).date

  for (let readme of ["master/README.md", "master/readme.md", "main/README.md", "main/readme.md"]) {
    try {
      const resp = await fetch(
        `https://raw.githubusercontent.com/${org}/${repo}/refs/heads/${readme}`,
      )
      if (resp.ok) {
        const txt = await resp.text()
        plugin.readme = `${txt}`
        break
      }
    } catch (e) {
      plugin.readme = `**${plugin.id}** readme is not available on GitHub. Please check the [plugin repository](https://github.com/${org}/${repo}) for more information.`
    }
  }

  const detail = await (
    await fetch(`https://api.github.com/repos/${org}/${repo}/releases?per_page=100`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  ).json()

  if( !detail.sort ){
    const debug = JSON.stringify(detail, null, 2)
    console.log(`No info for ${plugin.id}, ${debug} token ${token}`)
    return;
  }

  //top downloaded
  const list = detail
    .sort(
      (
        a: { assets: { name: string; download_count: number }[] },
        b: { assets: { name: string; download_count: number }[] },
      ) => {
        const ad = a.assets.filter((s) => s.name.endsWith("zip")).map((as) => as.download_count)
        const bd = b.assets.filter((s) => s.name.endsWith("zip")).map((as) => as.download_count)
        return ad > bd
      },
    )
    .slice(0, 10)
    .reverse()

  const xaxis = list.map((d: { tag_name: any }) => d.tag_name)
  const downloads = list.map((d: { assets: any[] }) => {
    return d.assets.filter((s) => s.name.endsWith("zip")).map((as) => as.download_count)
  })
  const maxDownloads = Math.max(...downloads)
  const minDownloads = Math.min(...downloads)

  const txt = `---
title: ${plugin.id}
draft: false
date: ${date}
tags:
${group ? `   - ${group}` : ""}
---

${plugin.readme}

# Downloads

\`\`\`mermaid
---
config:
    xyChart:
        width: 900
        height: 600
    themeVariables:
        xyChart:
            titleColor: "#ff0000"
            plotColorPalette: "green"
---
xychart-beta
    title "Top ${xaxis.length} Downloads for ${plugin.id}"    
    x-axis [${xaxis.join(", ")}]
    y-axis "Downloads" ${minDownloads} --> ${maxDownloads}
    bar [${downloads.join(", ")}]
\`\`\`
  
`

  const name = groupSlup(group as string)
  writeFileSync(`content/${name}/${plugin.id}.md`, txt)
}

const dumpIndex = () => {
  writeFileSync(
    `content/index.md`,
    `---
title: Welcome
draft: false
---

# The aim of this site

On this site, you will find comprehensive information about Nextflow plugins, including details about 
their release dates and the number of downloads for each. 

Whether you're looking to track the latest updates or evaluate the popularity of specific plugins, 
this platform provides all the insights you need in one place.

## Building 

This site uses a static site generator (quartz) to create an up-to-date markdown
file per plugin including public information about everyone

The code of this repository is available at [Github of Incremental Steps](https://github.com/incsteps/nf-plugins-stats)

### Adding Plugin 

In case you want to include your plugin, or miss someone, please create an issue in the repository


## About us

This site was developed by Incremental Steps as an altruistic endeavor. 

His primary goal is to provide much-needed visibility to the Nextflow plugin ecosystem, making it easier for users to discover and utilize these valuable tools.

Our passion for the Nextflow community drives this project. We believes that by centralizing information and showcasing the diverse range of available plugins, we can help researchers and developers alike streamline their bioinformatics workflows and unlock new possibilities. This site is a testament to the power of open-source collaboration and aims to foster a more connected and efficient Nextflow community.

## Custom Development

If you have specific needs for a custom Nextflow plugin or any other bespoke software solution, our team is available for hire. Feel free to connect with me on LinkedIn
(https://www.linkedin.com/in/jagedn/) or Mastodon (https://genomic.social/@jorge)
to discuss your project requirements.

## Comments

<script src="https://giscus.app/client.js"
        data-repo="incsteps/nf-plugins-stats"
        data-repo-id="R_kgDOO8XWRw"
        data-category="Announcements"
        data-category-id="DIC_kwDOO8XWR84Crzt3"
        data-mapping="pathname"
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="bottom"
        data-theme="preferred_color_scheme"
        data-lang="en"
        crossorigin="anonymous"
        async>
</script>

`,
  )
}

const dumpGroup = (group: string, title: string) => {
  writeFileSync(
    `content/${group}/index.md`,
    `---
title: ${title}
---
`,
  )
}

const main = async () => {
  const args: string[] = process.argv.slice(2);
  if( !args.length ){
    console.log(`Usage: node generate.js <token>`)
    return;
  }

  const plugins = await getPlugins();
  const names = groups.map((g) => g[0])
  for (let group of names) {
    const name = groupSlup(group as string)
    console.log(`Creating group name`)
    if (!fs.existsSync(`content/${name}`)) fs.mkdirSync(`content/${name}`, {recursive:true})
    dumpGroup(name, group as string)
  }
  for (let plugin of plugins) {
    await dumpPlugin(plugin, args[0])
  }
  dumpIndex()
}

main().then(() => console.log("Done"))