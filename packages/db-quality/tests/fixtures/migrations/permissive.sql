create policy "anyone reads" on public.profiles for select using (true);
CREATE POLICY "Anyone can insert" ON public.chat_profiles FOR INSERT WITH CHECK (true);
create policy "members" on public.orgs for select using (auth.uid() = owner_id);
