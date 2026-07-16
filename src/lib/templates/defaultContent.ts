// Default resume HTML markup, written for the mini-template engine
// (see engine.ts). This is exactly what ships with every built-in template
// until someone edits it in Settings > Templates > HTML - at that point
// their saved override replaces this string for that template id only.
export const DEFAULT_RESUME_HTML = `<main class="rt-page">
  <header class="rt-header">
    <h1 class="rt-name">{{name}}</h1>
    {{#if hasContactLinks}}<p class="rt-contact">{{&contactLinksHtml}}</p>{{/if}}
    {{#if hasContactDetails}}<p class="rt-contact">{{&contactDetailsHtml}}</p>{{/if}}
  </header>

  <section class="rt-section">
    <h2 class="rt-section-title">Summary</h2>
    <p class="rt-summary">{{{summary}}}</p>
  </section>

  <section class="rt-section">
    <h2 class="rt-section-title">Skills</h2>
    <div class="rt-skills">
      {{#each skillCategories}}
      <div class="rt-skill-row">
        <span class="rt-skill-label">{{category}}:</span>
        <span class="rt-token-wrap">{{#each items}}<span class="rt-token{{#if bold}} is-bold{{/if}}">{{name}}</span>{{/each}}</span>
      </div>
      {{/each}}
    </div>
  </section>

  <section class="rt-section">
    <h2 class="rt-section-title">Experience</h2>
    {{#each experience}}
    <article class="rt-entry">
      <div class="rt-entry-top">
        <h3 class="rt-entry-heading">{{companyName}}</h3>
        <div class="rt-entry-meta">{{duration}}</div>
      </div>
      <div class="rt-entry-sub">
        <div class="rt-entry-role">{{role}}</div>
        {{#if hasLocation}}<div class="rt-entry-location">{{location}}</div>{{/if}}
      </div>
      <ul class="rt-entry-bullets">
        {{#each points}}<li>{{{text}}}</li>{{/each}}
      </ul>
      {{#if hasSkillsUsed}}<p class="rt-tech-line"><span class="rt-tech-label">Tech Stack:&nbsp;&nbsp;</span>{{#each skillsUsed}}<span class="rt-token{{#if bold}} is-bold{{/if}}">{{name}}</span>{{/each}}</p>{{/if}}
    </article>
    {{/each}}
  </section>

  <section class="rt-section">
    <h2 class="rt-section-title">Projects</h2>
    {{#each projects}}
    <article class="rt-entry">
      <div class="rt-project-top">
        <h3 class="rt-project-name">{{nameMain}}{{#if hasSecondaryName}} <span class="rt-project-secondary">: {{nameSecondary}}</span>{{/if}}</h3>
        {{#if hasLinks}}<div class="rt-project-links">{{&linksHtml}}</div>{{/if}}
      </div>
      <p class="rt-project-about">{{{about}}}</p>
      {{#if hasTechStack}}<p class="rt-tech-line">{{#each techStack}}<span class="rt-token{{#if bold}} is-bold{{/if}}">{{name}}</span>{{/each}}</p>{{/if}}
    </article>
    {{/each}}
  </section>

  <section class="rt-section">
    <h2 class="rt-section-title">Education</h2>
    {{#each education}}
    <article class="rt-entry">
      <div class="rt-edu-top">
        <h3 class="rt-edu-inst">{{institution}}</h3>
        <div class="rt-entry-meta">{{duration}}</div>
      </div>
      <p class="rt-edu-degree">{{degree}}{{#if hasScore}}&nbsp;&middot;&nbsp;<span class="rt-edu-score">{{score}}</span>{{/if}}</p>
      {{#if hasCoursework}}<p class="rt-coursework"><strong>Relevant Coursework&nbsp;&nbsp;</strong>{{courseworkJoined}}</p>{{/if}}
    </article>
    {{/each}}
  </section>
</main>`;
