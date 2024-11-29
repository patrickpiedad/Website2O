---
title: The Building of my Blog
description: How I used 11ty and a YouTube tutorial to add a blog to my portfolio website.
publishedDate: 2024-05-15
tags:
- codingjourney
---

I created my portfolio website as part of the 100Devs training that I'm currently working through. One of the tips that were to use a template to build the base for your website, unless you're a designer that already has the knowledge to do so.

So that's what I did, and that's what you're reading this blog on right now!

*Quick shout out to HTML5 Up templates for giving a great starting point for devs like myself.*

Now if you're in the tech space, it won't take long for you to stumble upon the idea of documenting your journey in public, both for your own development AND to give employers an idea of who you are as a developer. Great advice.

Putting those pieces together, I asked myself, "How can I build a blog on my portfolio site?"

It proved to be **not-as-straight-forward** as I originally thought.

I had heard about all kinds of different options for blogs, such as WordPress, GitHub Pages, Hugo, etc... I found myself overwhelmed with the number of options as well as the complexity of learning another technology, then trying to figure out how to integrate that with my current portfolio website. Would I have to build a backend? How do I even make blog posts, hard-coding the HTML / MD files?

All great questions.

Luckily, I stumbled upon [11ty](https://www.11ty) and [Kevin Powell's YouTube tutorial](https://www.youtube.com/watch?v=4wD00RT6d-g&t=1s).

These resources were absolutely incredible in walking you through the process of using static site generation to add blog functionality to a website.

The whole idea behind the technology is to create "templates" that could be reused in your project and use "front matter" to populate content. For example, take a look at the blog picture for this post.

It specifically reads *include 'articleSnippet.njk'*

When the browser reads the code, it gets to this section and then looks for <i>'articleSnippet.njk'.</i> It then moves to that .njk and populates the page from that file. Once complete, it moves back to the main code and continues reading.

It definitely took time to rewrite the code to use the .njk templates and use the nunjucks language that 11ty reads. But it saves so much time when you're creating multiple web pages, like a blog.

Once everything was rewritten, Kevin walks you through how to host your site on Netlify through a GitHub repo. Once you do this, Netlify constantly monitors your repo and automatically regenerates your site when chagnes are detected. Your site is redeployed within minutes after pushing your changes to your GitHub repo. How cool is that?

Finally, Kevin walks you through adding a CMS, which I'm using to write this specific blog post. It has its bugs, but overall gives you a different interface to create posts.

I think the hardest AND coolest part of this experience was that Kevin's tutorial goes over the steps to create this functionality in the base files he provides. Since I already had my own website, I had to listen to what he was doing, internalize the idea, and then figure out how to apply it to my website.j

While this took FOREVER to figure out, it forced me to really understand the concepts. By the end, I walked away with a deep understanding of WHY things were written this way, not just how to write them.

Now, is this the most efficient way to create a blog?

Nope.

But it is the way that I decided to attack the challenge and I learned a whole lot out of it. The process of learning made me proud to show my website because it wasn't only a template that I changed the HTML text on. It was MY project.

Thanks for reading, til' next time.

Cheers,\
Pat
