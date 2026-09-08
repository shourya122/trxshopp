CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL DEFAULT '',
  rating integer NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  body text NOT NULL DEFAULT '',
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_title text NOT NULL DEFAULT '',
  verified boolean NOT NULL DEFAULT true,
  time_label text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published reviews" ON public.reviews
  FOR SELECT TO anon USING (published = true);

CREATE POLICY "Authenticated can view published reviews" ON public.reviews
  FOR SELECT TO authenticated USING (published = true OR private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage reviews" ON public.reviews
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX reviews_published_idx ON public.reviews (published, sort_order, created_at DESC);
CREATE INDEX reviews_product_idx ON public.reviews (product_id);

INSERT INTO public.reviews (author_name, rating, body, product_title, time_label, sort_order) VALUES
('Hitesh Sai', 5, 'Best reasonable games they''re providing. And service support as well. They''ll make sure that it''s worth for buying from TRXSHOP. Hoping to buy more further!', '', '3 days ago', 1),
('Ashraf Khan', 5, 'Bought a game from them — had a small login issue but their support team was quick to help once they were online. Very happy with the experience.', '', '1 week ago', 2),
('Arnab Bhattacharya', 5, 'Fantastic customer service. Any doubts you have, they reply almost instantly. Highly recommend buying games here.', '', '2 weeks ago', 3),
('Snoop', 5, 'This site is fantastic. Cheap, authentic games that work great. Hoping they bring in even more titles soon.', '', '3 weeks ago', 4),
('Akhil Swarop', 5, 'A trustable company with very good customer feedback. They respond and act on every query immediately. Very satisfied.', '', '1 month ago', 5),
('Rahul Mathur', 5, 'Amazing service for a great price. Was skeptical at first but they''re really good — would recommend to anyone.', '', '1 month ago', 6),
('Priya Verma', 5, 'Smooth purchase, instant delivery. Activation worked perfectly the first time. Will be back for more titles.', '', '1 month ago', 7),
('Vikram Singh', 5, 'Great pricing on Steam accounts and the team is super responsive. Definitely the best place for budget gamers in India.', '', '2 months ago', 8);