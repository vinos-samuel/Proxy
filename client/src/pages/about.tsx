import { Link } from "wouter";
import { SiteFooter, SiteNav } from "@/components/SiteChrome";
import founderPhoto from "@assets/image_1772539840046.png";

export default function AboutPage() {
  return (
    <div className="site">
      <SiteNav />
      <main className="content">
        <header className="content-head">
          <p className="site-eyebrow">About Proxy</p>
          <h1 className="site-display content-h1">Built for the <em>other side</em> of the table.</h1>
          <p className="content-lede">Most recruiting technology is built for recruiters. Proxy exists for the candidate.</p>
        </header>

        <section className="content-prose">
          <p className="content-pull">Senior professionals aren't short of experience. The systems they're judged by were never designed to show it.</p>
          <p>A PDF compresses 15 years of decisions and results into a format that's usually skimmed quickly by a screener who doesn't know the industry. That's not a talent problem. It's a communication problem.</p>
          <p>A stronger CV helps, but it can't carry all the context behind senior work. That takes a better way to tell the story, and a way for people to ask about it.</p>
        </section>

        <section className="about-founder">
          <img src={founderPhoto} alt="Vinos Samuel" />
          <div className="content-prose">
            <h2 className="site-display content-h2">Why I built this</h2>
            <p>I'm Vinos Samuel. I've spent 15+ years leading HR operations, talent acquisition, and workforce strategy across APAC at Netflix, Cielo, and Randstad Sourceright.</p>
            <p>I've sat in the rooms where hiring decisions get made. I've seen exceptional candidates lose out not because they weren't qualified, but because their story didn't land.</p>
            <p>Proxy is my answer to that. It turns the evidence behind your career into a page you review, own and share, and that can answer questions about your work.</p>
            <p className="site-faint">Vinos Samuel · Founder</p>
          </div>
        </section>

        <section className="content-cta">
          <h2 className="site-display content-h2">See what your CV looks like as a page.</h2>
          <Link className="site-btn" href="/try">Try it with your CV</Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
